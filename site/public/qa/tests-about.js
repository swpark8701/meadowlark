/**
 * Created by sewonpark on 2016-02-01.
 */
suite('"About" Page Tests', function(){
   test('page should contain link to contact page', function(){
      assert($('a[href="/contact"]').length);
   });
});